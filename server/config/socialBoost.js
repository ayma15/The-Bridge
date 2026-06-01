module.exports = {
  getServerConfig(serverId) {
    // serverId: 1 = N1PANEL, 2 = JUSTANOTHERPANEL
    if (serverId === 1 || serverId === 'N1PANEL') {
      const apiKey = process.env.N1PANEL_API_KEY;
      const apiUrl = process.env.N1PANEL_API_URL || 'https://n1panel.com/api/v2';
      if (!apiKey) {
        throw new Error('N1PANEL_API_KEY environment variable is required');
      }
      return { apiKey, apiUrl, serverId: 1, provider: 'N1PANEL' };
    }
    
    if (serverId === 2 || serverId === 'JUSTANOTHERPANEL' || serverId === 'JAP') {
      const apiKey = process.env.JUSTANOTHERPANEL_API_KEY;
      const apiUrl = process.env.JUSTANOTHERPANEL_API_URL || 'https://justanotherpanel.com/api/v2';
      if (!apiKey) {
        throw new Error('JUSTANOTHERPANEL_API_KEY environment variable is required');
      }
      return { apiKey, apiUrl, serverId: 2, provider: 'JUSTANOTHERPANEL' };
    }
    
    throw new Error(`Invalid serverId: ${serverId}. Must be 1 (N1PANEL) or 2 (JUSTANOTHERPANEL)`);
  },
  
  // Legacy support for existing code
  get JAP() {
    return this.getServerConfig(2);
  },
  get N1PANEL() {
    return this.getServerConfig(1);
  }
};

