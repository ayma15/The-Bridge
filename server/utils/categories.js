/**
 * Fixed Product Categories
 * These are the only allowed categories for products
 */
const PRODUCT_CATEGORIES = [
  'Electronics',
  'Computers & Accessories',
  'Phones & Accessories',
  'Home & Garden',
  'Fashion & Clothing',
  'Shoes & Accessories',
  'Beauty & Personal Care',
  'Health & Fitness',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Media',
  'Automotive',
  'Pet Supplies',
  'Food & Beverages',
  'Office Supplies',
  'Tools & Hardware',
  'Musical Instruments',
  'Art & Crafts',
  'Baby & Kids',
  'Jewelry & Watches',
  'Collectibles',
  'Other'
];

/**
 * Validate if a category is allowed
 */
function isValidCategory(category) {
  return PRODUCT_CATEGORIES.includes(category);
}

/**
 * Get all valid categories
 */
function getAllCategories() {
  return PRODUCT_CATEGORIES;
}

module.exports = {
  PRODUCT_CATEGORIES,
  isValidCategory,
  getAllCategories
};



