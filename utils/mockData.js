import { faker } from '@faker-js/faker/locale/zh_CN';

// 产品类别
export const productCategories = [
  // 电子产品
  '智能手表', '无线耳机', '蓝牙音箱', '智能手环', '充电宝',
  // 家居产品
  '沙发', '床垫', '桌子', '椅子', '衣柜',
  // 服装类
  '上衣', '裤子', '外套', '连衣裙', '鞋子',
  // 美妆类
  '口红', '面霜', '精华液', '香水', '护肤品',
  // 食品类
  '巧克力', '饼干', '咖啡', '茶叶', '山核桃',
  // 运动类
  '跑步鞋', '瑜伽垫', '健身器材', '自行车', '篮球'
];

// 品牌
export const brands = [
  'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Nike', 'Adidas', 'IKEA', 'MUJI', 'Zara', 'H&M',
  'Chanel', 'Dior', 'Gucci', 'Prada', 'Nestle', 'Coca-Cola', 'Pepsi', 'Starbucks', 'Nike', 'Under Armour'
];

// 产品类型
export const productTypes = [
  'Product', 'Item', 'Gadget', 'Device', 'Accessory', 'Tool', 'Gear', 'Equipment'
];

// 相机产品名称
export const cameraProducts = [
  'DJI Mini 3 Pro', 'DJI Air 2S', 'DJI Mavic 3', 'DJI FPV', 'DJI Phantom 4 Pro V2.0',
  'DJI Inspire 2', 'DJI Matrice 300 RTK', 'DJI Avata', 'DJI Mini 3', 'DJI Mavic 3 Classic',
  'DJI Mavic 3 Cine', 'DJI Mini 2', 'DJI Mini SE', 'DJI Mavic Air 2', 'DJI Mavic 2 Pro'
];

/**
 * 生成产品数据
 * @returns {Object} 包含名称和价格的产品数据
 */
export const generateProductData = () => {
  const randomCategory = productCategories[Math.floor(Math.random() * productCategories.length)];
  const randomBrand = brands[Math.floor(Math.random() * brands.length)];
  const randomAdjective = faker.commerce.productAdjective();
  
  // 生成标准格式的价格
  const standardPrice = `Rs. ${faker.number.int({ min: 1000, max: 50000 }).toLocaleString('en-IN')}`;
  
  return {
    name: `${randomBrand} ${randomAdjective}${randomCategory}`,
    price: standardPrice
  };
};

/**
 * 生成相机产品价格
 * @returns {string} 格式化的价格字符串
 */
export const generateCameraPrice = () => {
  return `Rs. ${faker.number.int({ min: 9999, max: 50000 }).toLocaleString('en-IN')}`;
};
