import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

// 使用全局变量防止重复初始化（即使在 React StrictMode 下）
declare global {
  interface Window {
    CMS?: {
      init: () => void;
    };
    __CMS_INITIALIZED__?: boolean;
  }
}

export default function AdminPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    // 使用 ref 和全局标记双重防止重复初始化
    if (initAttempted.current || (typeof window !== 'undefined' && window.__CMS_INITIALIZED__)) {
      return;
    }

    const initCMS = () => {
      // 多重检查防止重复初始化
      if (initAttempted.current || window.__CMS_INITIALIZED__) {
        return;
      }

      if (typeof window !== 'undefined' && window.CMS) {
        const rootElement = document.getElementById('nc-root');
        if (!rootElement) {
          console.warn('CMS root element not found');
          return;
        }

        // 检查是否已经有 CMS 实例在运行
        if (rootElement.querySelector('.nc-root')) {
          console.log('CMS already initialized, skipping');
          window.__CMS_INITIALIZED__ = true;
          return;
        }

        try {
          // 设置标记
          initAttempted.current = true;
          window.__CMS_INITIALIZED__ = true;
          
          // Decap CMS 会自动查找 /admin/config.yml
          // 通过 rewrites，这个路径会被重定向到 /api/admin/config
          window.CMS.init();
        } catch (error) {
          console.error('CMS initialization error:', error);
          // 重置标记以允许重试
          initAttempted.current = false;
          window.__CMS_INITIALIZED__ = false;
        }
      }
    };

    // 如果脚本已经加载
    if (window.CMS) {
      // 延迟初始化，确保 DOM 已准备好
      const timer = setTimeout(initCMS, 300);
      return () => clearTimeout(timer);
    } else {
      // 等待脚本加载
      const handleLoad = () => {
        setTimeout(initCMS, 300);
      };
      
      // 监听 load 事件
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
      }

      // 也轮询检查 CMS 是否已加载（双重保险）
      const checkInterval = setInterval(() => {
        if (window.CMS) {
          clearInterval(checkInterval);
          handleLoad();
        }
      }, 100);

      return () => {
        window.removeEventListener('load', handleLoad);
        clearInterval(checkInterval);
      };
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>SWT Job Picker - 内容管理</title>
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
          // 延迟初始化，避免与 React 的 DOM 操作冲突
          // 使用更长的延迟确保 React 渲染完成
          setTimeout(() => {
            if (window.CMS && !window.__CMS_INITIALIZED__) {
              const rootElement = document.getElementById('nc-root');
              if (rootElement && !rootElement.querySelector('.nc-root')) {
                try {
                  window.__CMS_INITIALIZED__ = true;
                  window.CMS.init();
                } catch (error) {
                  console.error('CMS initialization error:', error);
                  window.__CMS_INITIALIZED__ = false;
                }
              }
            }
          }, 500);
        }}
      />
    </>
  );
}

