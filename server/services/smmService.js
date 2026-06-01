const axios = require('axios');
const config = require('../config/socialBoost');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SMM Panel Service
 * Handles integrations with n1panel.com and justanotherpanel.com
 * Uses database-stored services and dynamic credentials
 */

class SMMService {
  /**
   * Make request to SMM panel with full logging
   */
  async requestPanel(serverId, payload) {
    const serverConfig = config.getServerConfig(serverId);
    const { apiKey, apiUrl, provider } = serverConfig;

    // Build URL-encoded form data
    const params = new URLSearchParams();
    params.append('key', apiKey);
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }

    const requestLog = {
      timestamp: new Date().toISOString(),
      provider,
      serverId,
      action: payload.action,
      service: payload.service,
      quantity: payload.quantity,
      url: apiUrl,
      body: params.toString()
    };

    console.log('[SMM Panel] REQUEST:', JSON.stringify(requestLog, null, 2));

    try {
      const response = await axios.post(apiUrl, params.toString(), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      const responseLog = {
        timestamp: new Date().toISOString(),
        provider,
        serverId,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: {
          'content-type': response.headers['content-type'],
          'content-length': response.headers['content-length']
        }
      };

      console.log('[SMM Panel] RESPONSE:', JSON.stringify(responseLog, null, 2));

      if (response.data && (response.data.error || response.data.errors)) {
        const errorMsg = response.data.error || 
                        (Array.isArray(response.data.errors) ? response.data.errors.join(', ') : response.data.errors);
        throw new Error(`Provider error: ${errorMsg}`);
      }

      return response.data;
    } catch (error) {
      const errorLog = {
        timestamp: new Date().toISOString(),
        provider,
        serverId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestBody: params.toString()
      };

      console.error('[SMM Panel] ERROR:', JSON.stringify(errorLog, null, 2));
      throw error;
    }
  }

  /**
   * Get services from provider and sync to database
   */
  async syncServices(serverId) {
    const serverConfig = config.getServerConfig(serverId);
    const { provider } = serverConfig;

    console.log(`[SMM Sync] Fetching services from ${provider} (serverId: ${serverId})`);

    try {
      const response = await this.requestPanel(serverId, { action: 'services' });
      
      if (!Array.isArray(response)) {
        throw new Error(`Invalid response format from ${provider}: expected array, got ${typeof response}`);
      }

      console.log(`[SMM Sync] Received ${response.length} services from ${provider}`);

      const syncResults = { created: 0, updated: 0, failed: 0, total: response.length };

      for (const service of response) {
        try {
          const providerServiceId = String(service.service || service.id);
          
          await prisma.sMMService.upsert({
            where: {
              unique_provider_service: {
                serverId,
                providerServiceId
              }
            },
            create: {
              serverId,
              providerServiceId,
              name: service.name || 'Unknown Service',
              category: service.category || 'Uncategorized',
              type: service.type || null,
              rate: parseFloat(service.rate) || 0,
              min: parseInt(service.min) || 1,
              max: parseInt(service.max) || 1000,
              increment: parseInt(service.increment || service.step || 1) || 1,
              description: service.desc || service.description || null,
              dripfeed: service.dripfeed === true || service.dripfeed === 'true',
              refill: service.refill === true || service.refill === 'true',
              cancel: service.cancel === true || service.cancel === 'true',
              providerData: service,
              isActive: true,
              lastSyncedAt: new Date()
            },
            update: {
              name: service.name || 'Unknown Service',
              category: service.category || 'Uncategorized',
              type: service.type || null,
              rate: parseFloat(service.rate) || 0,
              min: parseInt(service.min) || 1,
              max: parseInt(service.max) || 1000,
              increment: parseInt(service.increment || service.step || 1) || 1,
              description: service.desc || service.description || null,
              dripfeed: service.dripfeed === true || service.dripfeed === 'true',
              refill: service.refill === true || service.refill === 'true',
              cancel: service.cancel === true || service.cancel === 'true',
              providerData: service,
              isActive: true,
              lastSyncedAt: new Date()
            }
          });

          syncResults.updated++;
        } catch (upsertError) {
          console.error(`[SMM Sync] Failed to sync service ${service.service || service.id}:`, upsertError.message);
          syncResults.failed++;
        }
      }

      console.log(`[SMM Sync] Completed for ${provider}:`, syncResults);
      return syncResults;
    } catch (error) {
      console.error(`[SMM Sync] Failed for ${provider}:`, error.message);
      throw error;
    }
  }

  /**
   * Get services from database for a specific server
   */
  async getServicesFromDB(serverId) {
    const services = await prisma.sMMService.findMany({
      where: { serverId, isActive: true },
      orderBy: { category: 'asc' }
    });

    console.log(`[SMM DB] Retrieved ${services.length} services for serverId ${serverId}`);
    return services;
  }

  /**
   * Get a single service from database by ID
   */
  async getServiceFromDB(serviceId) {
    const service = await prisma.sMMService.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error(`Service not found in database: ${serviceId}`);
    }

    return service;
  }

  /**
   * Create order on SMM panel
   */
  async createOrder(serverId, providerServiceId, quantity, link) {
    if (!quantity || quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    if (!link || typeof link !== 'string' || link.trim().length === 0) {
      throw new Error('Link is required');
    }

    const payload = {
      action: 'add',
      service: String(providerServiceId),
      quantity: parseInt(quantity),
      link: link.trim()
    };

    const response = await this.requestPanel(serverId, payload);

    if (!response.order && !response.id) {
      throw new Error(`Invalid provider response: missing order ID. Response: ${JSON.stringify(response)}`);
    }

    return {
      orderId: response.order || response.id,
      status: response.status || 'PENDING',
      charge: response.charge || response.cost || 0,
      providerResponse: response
    };
  }

  /**
   * Get order status from SMM panel
   */
  async getOrderStatus(serverId, externalOrderId) {
    const response = await this.requestPanel(serverId, {
      action: 'status',
      order: String(externalOrderId)
    });

    return {
      status: response.status,
      startCount: response.start_count || response.startCount,
      remains: response.remains,
      charge: response.charge || response.cost,
      providerResponse: response
    };
  }

  // Legacy methods for backward compatibility
  async getN1PanelServices() { return this.syncServices(1); }
  async getJustAnotherPanelServices() { return this.syncServices(2); }
  async createN1PanelOrder(serviceId, quantity, link) { return this.createOrder(1, serviceId, quantity, link); }
  async createJustAnotherPanelOrder(serviceId, quantity, link) { return this.createOrder(2, serviceId, quantity, link); }
  async getN1PanelOrderStatus(orderId) { return this.getOrderStatus(1, orderId); }
  async getJustAnotherPanelOrderStatus(orderId) { return this.getOrderStatus(2, orderId); }
}

module.exports = new SMMService();

