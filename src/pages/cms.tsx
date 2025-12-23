import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

// 使用全局变量防止重复初始化（即使在 React StrictMode 下）
declare global {
  interface Window {
    CMS?: {
      init: () => void;
    };
    __CMS_INITIALIZED__?: boolean;
    __CMS_INIT_TIMEOUT__?: NodeJS.Timeout;
    __CMS_ROOT_ELEMENT__?: HTMLElement;
  }
}

export default function AdminPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // 标记组件已挂载
    mountedRef.current = true;

    // 监听来自授权窗口的 postMessage（保留原有逻辑，避免行为变化）
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[CMS Admin] 收到消息:', typeof message === 'string' ? message.substring(0, 100) : message);
      console.log('[CMS Admin] 消息来源:', event.origin);

      if (typeof message === 'string' && message.startsWith('authorization:github:success:')) {
        try {
          const data = JSON.parse(message.replace('authorization:github:success:', ''));
          console.log('[CMS Admin] 授权成功，Token:', data.token ? '已接收' : '未找到');
        } catch (e) {
          console.error('[CMS Admin] 解析授权消息失败:', e);
        }
      } else if (typeof message === 'string' && message.startsWith('authorization:github:error:')) {
        const errorData = message.replace('authorization:github:error:', '');
        console.error('[CMS Admin] 授权失败:', errorData);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('message', handleMessage);

      // 清理可能存在的超时
      if (window.__CMS_INIT_TIMEOUT__) {
        clearTimeout(window.__CMS_INIT_TIMEOUT__);
        delete window.__CMS_INIT_TIMEOUT__;
      }
    };
  }, []);

  useEffect(() => {
    // 如果已经初始化，直接返回
    if (window.__CMS_INITIALIZED__) {
      return;
    }

    // 如果脚本还没加载，等待
    if (!scriptLoaded || typeof window === 'undefined' || !window.CMS) {
      return;
    }

    // 确保组件已挂载
    if (!mountedRef.current) {
      return;
    }

    const rootElement = document.getElementById('nc-root');
    if (!rootElement) {
      return;
    }

    // 检查是否已经有 CMS 实例在运行
    if (rootElement.querySelector('.nc-root') || rootElement.querySelector('[data-netlify-cms-root]')) {
      window.__CMS_INITIALIZED__ = true;
      return;
    }

    // 使用全局超时标记，防止重复初始化
    if (window.__CMS_INIT_TIMEOUT__) {
      return;
    }

    // 延迟初始化，确保 React 渲染完成
    window.__CMS_INIT_TIMEOUT__ = setTimeout(() => {
      // 再次检查所有条件
      if (!mountedRef.current || window.__CMS_INITIALIZED__) {
        delete window.__CMS_INIT_TIMEOUT__;
        return;
      }

      const element = document.getElementById('nc-root');
      if (!element) {
        delete window.__CMS_INIT_TIMEOUT__;
        return;
      }

      // 检查是否已经有 CMS 实例
      if (element.querySelector('.nc-root') || element.querySelector('[data-netlify-cms-root]')) {
        window.__CMS_INITIALIZED__ = true;
        delete window.__CMS_INIT_TIMEOUT__;
        return;
      }

      try {
        if (window.CMS && mountedRef.current) {
          window.__CMS_INITIALIZED__ = true;
          window.__CMS_ROOT_ELEMENT__ = element;

          try {
            window.CMS.init();
            console.log('[CMS] 初始化成功');
          } catch (initError) {
            console.error('[CMS] 初始化错误:', initError);
            window.__CMS_INITIALIZED__ = false;
          }

          delete window.__CMS_INIT_TIMEOUT__;
        }
      } catch (error) {
        console.error('[CMS] 初始化错误:', error);
        window.__CMS_INITIALIZED__ = false;
        delete window.__CMS_INIT_TIMEOUT__;
      }
    }, 500);
  }, [scriptLoaded]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>SWT Helper - 内容管理</title>
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          #nc-root {
            min-height: 100vh;
          }
        `}</style>
      </Head>
      <div id="nc-root" ref={rootRef}></div>
      <Script
        src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('[CMS] Decap CMS 脚本加载完成');
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[CMS] 加载 Decap CMS 脚本失败:', e);
        }}
      />
    </>
  );
}


