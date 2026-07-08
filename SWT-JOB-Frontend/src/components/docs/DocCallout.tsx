import type { ReactNode } from 'react';
import {
  InfoOutlined,
  LightbulbOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';

export type CalloutKind = 'note' | 'tip' | 'warning' | 'info';

const LABELS: Record<CalloutKind, string> = {
  note: '说明',
  tip: '提示',
  warning: '注意',
  info: '信息',
};

const ICONS: Record<CalloutKind, ReactNode> = {
  note: <InfoOutlined fontSize="small" />,
  tip: <LightbulbOutlined fontSize="small" />,
  warning: <WarningAmberOutlined fontSize="small" />,
  info: <InfoOutlined fontSize="small" />,
};

export function DocCallout({
  kind,
  title,
  children,
}: {
  kind: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`docs-callout docs-callout--${kind}`} data-callout={kind}>
      <div className="docs-callout-header">
        <span className="docs-callout-icon" aria-hidden>
          {ICONS[kind]}
        </span>
        <span className="docs-callout-label">{title ?? LABELS[kind]}</span>
      </div>
      <div className="docs-callout-body">{children}</div>
    </aside>
  );
}

/** 解析 GitHub 风格 `[!NOTE]` blockquote */
export function parseCalloutFromBlockquote(children: ReactNode): {
  kind: CalloutKind;
  title?: string;
  body: ReactNode;
} | null {
  const flat = flattenReactText(children).trim();
  const alertMatch = flat.match(/^\[!([A-Z]+)\]/i);
  if (alertMatch) {
    const kind = mapAlertKind(alertMatch[1]);
    if (!kind) return null;
    return { kind, body: dropFirstBlock(children) };
  }

  const labelMatch = flat.match(/^(说明|提示|注意|信息|官方来源)[：:]/);
  if (labelMatch) {
    const kind = mapChineseLabel(labelMatch[1]);
    return { kind, title: labelMatch[1], body: children };
  }

  return null;
}

function dropFirstBlock(children: ReactNode): ReactNode {
  if (Array.isArray(children)) {
    const rest = children.slice(1);
    return rest.length > 0 ? rest : children;
  }
  if (typeof children === 'string') {
    const lines = children.split('\n');
    const trimmed = lines.slice(1).join('\n').trim();
    return trimmed || children.replace(/^\[!([A-Z]+)\]\s*/i, '');
  }
  return children;
}

function mapAlertKind(raw: string): CalloutKind | null {
  const key = raw.toLowerCase();
  if (key === 'note') return 'note';
  if (key === 'tip') return 'tip';
  if (key === 'warning' || key === 'caution') return 'warning';
  if (key === 'info' || key === 'important') return 'info';
  return null;
}

function mapChineseLabel(label: string): CalloutKind {
  if (label === '提示') return 'tip';
  if (label === '注意') return 'warning';
  if (label === '信息') return 'info';
  return 'note';
}

function flattenReactText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenReactText).join('');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return flattenReactText(props?.children);
  }
  return '';
}
