import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检测是否是本地开发环境
    const host = req.headers.host || '';
    const isLocal = process.env.NODE_ENV === 'development' || 
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.includes('localhost:3000');
    
    // 根据环境选择配置文件
    const configFileName = isLocal ? 'config.local.yml' : 'config.yml';
    const configPath = path.join(process.cwd(), 'public', 'admin', configFileName);
    
    console.log(`[CMS Config] Environment: ${isLocal ? 'local' : 'production'}`);
    console.log(`[CMS Config] Loading: ${configFileName}`);
    console.log(`[CMS Config] Path: ${configPath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(configPath)) {
      console.error(`[CMS Config] File not found: ${configPath}`);
      // 如果本地配置文件不存在，尝试使用生产配置
      const fallbackPath = path.join(process.cwd(), 'public', 'admin', 'config.yml');
      if (fs.existsSync(fallbackPath)) {
        console.log(`[CMS Config] Using fallback: config.yml`);
        const configContent = fs.readFileSync(fallbackPath, 'utf-8');
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(configContent);
      }
      return res.status(404).json({ 
        error: 'Config file not found',
        path: configPath
      });
    }
    
    // 读取配置文件
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // 设置正确的 Content-Type
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.status(200).send(configContent);
  } catch (error) {
    console.error('[CMS Config] Error loading config:', error);
    res.status(500).json({ 
      error: 'Failed to load config file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

