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

    // 立即设置全局错误处理，防止 removeChild 错误影响 CMS
    const setupGlobalErrorHandler = () => {
      // 捕获全局错误，过滤掉 Decap CMS 的 removeChild 错误
      const originalErrorHandler = window.onerror;
      
      // 错误处理函数
      const errorHandler = function(msg: string | Event | null, url?: string, line?: number, col?: number, error?: Error | null): boolean {
        // 处理字符串消息
        if (typeof msg === 'string') {
          if (msg.includes('removeChild') || msg.includes('NotFoundError')) {
            console.warn('[CMS] removeChild 错误（已忽略）:', msg.substring(0, 100));
            return true; // 阻止默认错误处理
          }
        }
        
        // 处理 Error 对象
        if (error) {
          const errorMessage = error.message || '';
          const errorName = error.name || '';
          
          if (errorName === 'NotFoundError' || 
              errorMessage.includes('removeChild') || 
              errorMessage.includes('not a child')) {
            console.warn('[CMS] NotFoundError removeChild（已忽略）:', errorMessage.substring(0, 100));
            return true;
          }
        }
        
        // 其他错误正常处理
        if (originalErrorHandler) {
          return originalErrorHandler.call(window, msg as string | Event, url, line, col, error as Error);
        }
        return false;
      };
      
      window.onerror = errorHandler as OnErrorEventHandler;
      
      // 也捕获 Error 事件（捕获阶段）
      const errorEventListener = (event: ErrorEvent) => {
        const error = event.error;
        const message = error?.message || event.message || '';
        
        if (error?.name === 'NotFoundError' || 
            message.includes('removeChild') || 
            message.includes('not a child') ||
            (error?.stack && error.stack.includes('react-dom'))) {
          console.warn('[CMS] Error 事件中的 removeChild（已忽略）:', message.substring(0, 100));
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      };
      
      window.addEventListener('error', errorEventListener, true);
      
      // 捕获未处理的 Promise 拒绝
      const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason?.message || '';
        const stack = reason?.stack || '';
        
        if (reason?.name === 'NotFoundError' ||
            message.includes('removeChild') || 
            message.includes('not a child') ||
            (stack && (stack.includes('decap-cms') || stack.includes('react-dom')))) {
          console.warn('[CMS] Decap CMS Promise 错误（已忽略）:', message.substring(0, 100));
          event.preventDefault();
        }
      };
      
      window.addEventListener('unhandledrejection', unhandledRejectionHandler);
      
      // 返回清理函数
      return () => {
        window.onerror = originalErrorHandler || null;
        window.removeEventListener('error', errorEventListener, true);
        window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      };
    };

    const cleanupErrorHandler = setupGlobalErrorHandler();

    // 监听来自授权窗口的 postMessage
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[CMS Admin] 收到消息:', typeof message === 'string' ? message.substring(0, 100) : message);
      console.log('[CMS Admin] 消息来源:', event.origin);

      if (typeof message === 'string' && message.startsWith('authorization:github:success:')) {
        try {
          const data = JSON.parse(message.replace('authorization:github:success:', ''));
          console.log('[CMS Admin] 授权成功，Token:', data.token ? '已接收' : '未找到');
          
          // Decap CMS 会自动处理这个消息
          // 我们需要等待足够的时间让 CMS 处理认证并更新 UI
          console.log('[CMS Admin] 等待 Decap CMS 处理认证消息（3秒）...');
          
          // 等待 3 秒让 CMS 处理消息，然后检查状态
          setTimeout(() => {
            const rootElement = document.getElementById('nc-root');
            if (!rootElement) {
              console.log('[CMS Admin] 找不到 root element，刷新页面');
              window.location.reload();
              return;
            }
            
            // 检查是否还有登录界面
            const loginElements = rootElement.querySelectorAll('button, a, [class*="login"], [class*="Login"]');
            const hasLoginUI = Array.from(loginElements).some(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('login') || text.includes('登录') || text.includes('sign in');
            });
            
            // 检查是否有 CMS 内容
            const cmsContent = rootElement.querySelector('.nc-root, [data-netlify-cms-root], [class*="nc-"]');
            const hasCMSContent = cmsContent && cmsContent.children.length > 0;
            
            console.log('[CMS Admin] 检查结果:', {
              hasLoginUI,
              hasCMSContent,
              loginElementsCount: loginElements.length
            });
            
            // 如果还有登录界面且没有 CMS 内容，刷新页面
            if (hasLoginUI && !hasCMSContent) {
              console.log('[CMS Admin] 仍有登录界面，刷新页面以应用认证状态');
              window.location.reload();
            } else if (!hasLoginUI && hasCMSContent) {
              console.log('[CMS Admin] CMS 内容已显示，认证成功，无需刷新');
            } else {
              // 不确定状态，再等 2 秒后刷新
              console.log('[CMS Admin] 状态不确定，再等待 2 秒后刷新');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }, 3000);
          
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
            console.log('[CMS Admin] 检测到 localStorage 中的 token（fallback），可能是授权成功');
            // 清除 localStorage 中的 token（避免重复触发）
            localStorage.removeItem('cms_token');
            localStorage.removeItem('cms_token_timestamp');
            
            // 等待 CMS 处理，然后检查状态
            setTimeout(() => {
              const rootElement = document.getElementById('nc-root');
              if (rootElement) {
                const loginElements = rootElement.querySelectorAll('button, a, [class*="login"]');
                const hasLoginUI = Array.from(loginElements).some(el => {
                  const text = el.textContent?.toLowerCase() || '';
                  return text.includes('login') || text.includes('登录');
                });
                
                const cmsContent = rootElement.querySelector('.nc-root, [data-netlify-cms-root]');
                const hasCMSContent = cmsContent && cmsContent.children.length > 0;
                
                if (hasLoginUI && !hasCMSContent) {
                  console.log('[CMS Admin] Fallback: 仍有登录界面，刷新页面');
                  window.location.reload();
                } else {
                  console.log('[CMS Admin] Fallback: CMS 可能已更新，不刷新');
                }
              }
            }, 3000);
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
      cleanupErrorHandler(); // 清理错误处理器
      
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
        if (rootElement && rootElement.parentNode) {
          // 使用更安全的方式：检查每个子节点是否仍然存在
          // 在 React StrictMode 下，第一次清理可能已经移除了所有子节点
          const children = Array.from(rootElement.children);
          
          // 如果已经没有子节点，直接返回，避免不必要的操作
          if (children.length === 0) {
            return;
          }
          
          // 逐个安全地移除子节点
          children.forEach((child) => {
            try {
              // 双重检查：确保子节点仍然存在且父节点匹配
              if (child && child.parentNode === rootElement && rootElement.contains(child)) {
                rootElement.removeChild(child);
              }
            } catch {
              // 忽略单个子节点的删除错误
              // 这通常发生在 React StrictMode 的双重清理中
            }
          });
        }
      } catch {
        // 忽略 DOM 操作错误，避免控制台报错
        // 这些错误通常是由于 React StrictMode 的双重清理导致的
        // 或者 Decap CMS 已经清理了 DOM
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
              if (existingRoot) {
                // 双重检查：确保元素仍然存在且父节点匹配
                if (existingRoot.parentNode === element && element.contains(existingRoot)) {
                  try {
                    element.removeChild(existingRoot);
                  } catch {
                    // 如果移除失败，尝试使用 replaceWith 或直接清空
                    try {
                      existingRoot.replaceWith(document.createDocumentFragment());
                    } catch {
                      // 最后的手段：直接清空父元素的 innerHTML（但保留元素本身）
                      if (element.children.length > 0) {
                        element.innerHTML = '';
                      }
                    }
                  }
                }
              }
            } catch (cleanupError) {
              // 忽略清理错误，继续初始化
              // 这些错误通常是由于 React StrictMode 或 DOM 状态不一致导致的
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
          // 标记脚本已加载
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

