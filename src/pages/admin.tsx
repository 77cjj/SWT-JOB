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

    // 清理函数
    return () => {
      mountedRef.current = false;
      // 清理可能存在的超时
      if (window.__CMS_INIT_TIMEOUT__) {
        clearTimeout(window.__CMS_INIT_TIMEOUT__);
        delete window.__CMS_INIT_TIMEOUT__;
      }
      // 安全地清理 DOM，避免 removeChild 错误
      // 注意：在 React StrictMode 下，清理函数会被调用两次
      // 我们需要确保只在元素确实存在且是有效子节点时才删除
      try {
        const rootElement = document.getElementById('nc-root');
        if (rootElement) {
          // 使用更安全的方式清理：直接设置 innerHTML 为空
          // 这比逐个删除子节点更安全，避免 removeChild 错误
          const children = Array.from(rootElement.children);
          children.forEach((child) => {
            try {
              if (child.parentNode === rootElement) {
                rootElement.removeChild(child);
              }
            } catch {
              // 忽略单个子节点的删除错误
            }
          });
        }
      } catch {
        // 忽略 DOM 操作错误，避免控制台报错
        // 这些错误通常是由于 React StrictMode 的双重清理导致的
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
          // 确保根元素存在且是有效的
          if (element && element.parentNode) {
            window.__CMS_INITIALIZED__ = true;
            window.__CMS_ROOT_ELEMENT__ = element;
            window.CMS.init();
            delete window.__CMS_INIT_TIMEOUT__;
          } else {
            console.warn('CMS root element is not valid');
            delete window.__CMS_INIT_TIMEOUT__;
          }
        }
      } catch (error) {
        console.error('CMS initialization error:', error);
        window.__CMS_INITIALIZED__ = false;
        delete window.__CMS_INIT_TIMEOUT__;
      }
    }, 500);
  }, [scriptLoaded]);

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
          // 标记脚本已加载
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load Decap CMS script:', e);
        }}
      />
    </>
  );
}

