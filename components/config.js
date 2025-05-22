// 基础配置文件
const config = {
    // API服务器地址 - 根据后端服务器IP和端口进行修改
    API_BASE_URL : 'http://192.168.0.234:3000',  
    
    // 其他配置项
    APP_NAME: '密码管理器',
    APP_VERSION: '1.0.0',
    
    // 通知配置
    NOTIFICATION_SETTINGS: {
      DEFAULT_REMINDER_TIME: 7,  // 默认提醒时间（天）
    }
  };
  
  export default config;