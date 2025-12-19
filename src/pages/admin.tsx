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

    // 监听来自授权窗口的 postMessage
    const handleMessage = (event: MessageEvent) => {
      // 安全检查：只接受来自同源的消息（生产环境可能需要放宽）
      // if (event.origin !== window.location.origin) {
      //   return;
      // }

      const message = event.data;
      console.log('[CMS Admin] 收到消息:', message);

      if (typeof message === 'string' && message.startsWith('authorization:github:success:')) {
        try {
          const data = JSON.parse(message.replace('authorization:github:success:', ''));
          console.log('[CMS Admin] 授权成功，Token:', data.token ? '已接收' : '未找到');
          
          // 如果 CMS 已经初始化，可能需要重新加载以应用新的认证状态
          if (window.CMS && window.__CMS_INITIALIZED__) {
            console.log('[CMS Admin] CMS 已初始化，可能需要刷新页面以应用认证状态');
            // 可以尝试刷新页面或重新初始化 CMS
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (e) {
          console.error('[CMS Admin] 解析授权消息失败:', e);
        }
      } else if (typeof message === 'string' && message.startsWith('authorization:github:error:')) {
        const errorData = message.replace('authorization:github:error:', '');
        console.error('[CMS Admin] 授权失败:', errorData);
      }
    };

    // 检查 localStorage 中的 token（fallback 机制）
    const checkLocalStorageToken = () => {
      try {
        const token = localStorage.getItem('cms_token');
        const timestamp = localStorage.getItem('cms_token_timestamp');
        
        if (token && timestamp) {
          const age = Date.now() - parseInt(timestamp, 10);
          // 如果 token 是最近 5 分钟内存储的，可能是授权窗口发送的
          if (age < 5 * 60 * 1000) {
            console.log('[CMS Admin] 检测到 localStorage 中的 token，可能是授权成功');
            // 清除 localStorage 中的 token
            localStorage.removeItem('cms_token');
            localStorage.removeItem('cms_token_timestamp');
            
            // 如果 CMS 已初始化，刷新页面
            if (window.CMS && window.__CMS_INITIALIZED__) {
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
        }
      } catch (e) {
        // localStorage 可能不可用（隐私模式等）
        console.warn('[CMS Admin] 无法访问 localStorage:', e);
      }
    };

    // 添加消息监听器
    window.addEventListener('message', handleMessage);

    // 定期检查 localStorage（作为 fallback）
    const storageCheckInterval = setInterval(checkLocalStorageToken, 1000);

    // 清理函数
    return () => {
      mountedRef.current = false;
      window.removeEventListener('message', handleMessage);
      clearInterval(storageCheckInterval);
      
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
            // 在初始化前，先清理可能存在的旧实例
            try {
              // 尝试清理 CMS 可能创建的 DOM 结构
              const existingRoot = element.querySelector('.nc-root, [data-netlify-cms-root]');
              if (existingRoot && existingRoot.parentNode === element) {
                // 安全地移除旧实例
                element.removeChild(existingRoot);
              }
            } catch (cleanupError) {
              // 忽略清理错误，继续初始化
              console.warn('[CMS] 清理旧实例时出错（可忽略）:', cleanupError);
            }

            window.__CMS_INITIALIZED__ = true;
            window.__CMS_ROOT_ELEMENT__ = element;
            
            // 包装 CMS.init() 调用，捕获可能的 DOM 操作错误
            try {
              window.CMS.init();
              console.log('[CMS] 初始化成功');
            } catch (initError: unknown) {
              // 捕获初始化错误，特别是 removeChild 错误
              const errorObj = initError as { message?: string };
              if (errorObj.message && errorObj.message.includes('removeChild')) {
                console.warn('[CMS] removeChild 错误（通常可忽略）:', errorObj.message);
                // 尝试重新初始化
                setTimeout(() => {
                  if (window.CMS && element && element.parentNode) {
                    try {
                      window.CMS.init();
                    } catch (retryError) {
                      console.error('[CMS] 重试初始化失败:', retryError);
                    }
                  }
                }, 1000);
              } else {
                throw initError;
              }
            }
            
            delete window.__CMS_INIT_TIMEOUT__;
          } else {
            console.warn('[CMS] Root element is not valid');
            delete window.__CMS_INIT_TIMEOUT__;
          }
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
          console.log('[CMS] Decap CMS 脚本加载完成');
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[CMS] 加载 Decap CMS 脚本失败:', e);
        }}
      />
      {/* 全局错误处理：捕获 Decap CMS 内部的 removeChild 错误 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // 捕获全局错误，过滤掉 Decap CMS 的 removeChild 错误
              const originalErrorHandler = window.onerror;
              window.onerror = function(msg, url, line, col, error) {
                // 如果是 removeChild 错误且来自 decap-cms，只记录警告而不抛出
                if (msg && typeof msg === 'string' && 
                    msg.includes('removeChild') && 
                    (url && url.includes('decap-cms'))) {
                  console.warn('[CMS] Decap CMS removeChild 错误（已忽略）:', msg);
                  return true; // 阻止默认错误处理
                }
                // 其他错误正常处理
                if (originalErrorHandler) {
                  return originalErrorHandler.call(this, msg, url, line, col, error);
                }
                return false;
              };
              
              // 捕获未处理的 Promise 拒绝
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    event.reason.message.includes('removeChild') &&
                    event.reason.stack && event.reason.stack.includes('decap-cms')) {
                  console.warn('[CMS] Decap CMS Promise 错误（已忽略）:', event.reason.message);
                  event.preventDefault(); // 阻止默认错误处理
                }
              });
            })();
          `,
        }}
      />
    </>
  );
}

