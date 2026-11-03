window.__ModuleLoader__.load({
  id: 'dsh-onebot-fish',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    function FloatingConsole() {
      const [open, setOpen] = useState(false);
      const [pos, setPos] = useState({ x: null, y: null });

      useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [open]);

      const startDrag = (e) => {
        if (e.target.closest && (e.target.closest('button') || e.target.closest('a'))) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const baseX = rect.left;
        const baseY = rect.top;
        const move = (ev) => {
          setPos({ x: Math.max(0, baseX + ev.clientX - startX), y: Math.max(0, baseY + ev.clientY - startY) });
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      };

      const button = h('button', {
        key: 'fab',
        type: 'button',
        title: 'QQ 机器人控制台',
        onClick: () => setOpen((v) => !v),
        style: {
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 46,
          height: 46,
          borderRadius: 23,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'linear-gradient(135deg,#3fa9f5,#1b6fb8)',
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          zIndex: 2147483000,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        },
      }, '鱼');

      if (!open) return button;

      const panelStyle = {
        position: 'fixed',
        left: pos.x === null ? undefined : pos.x,
        top: pos.y === null ? undefined : pos.y,
        right: pos.x === null ? 20 : 'auto',
        bottom: pos.y === null ? 80 : 'auto',
        width: 'min(900px, 82vw)',
        height: 'min(680px, 76vh)',
        background: '#0f1115',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 12,
        boxShadow: '0 18px 48px rgba(0,0,0,0.5)',
        zIndex: 2147483000,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      };

      return h('div', { key: 'root' }, [
        button,
        h('div', { key: 'panel', style: panelStyle }, [
          h('div', {
            key: 'bar',
            onMouseDown: startDrag,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              background: '#161a20',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              cursor: 'move',
              userSelect: 'none',
            },
          }, [
            h('strong', { key: 't', style: { fontSize: 13, color: '#dfe4ea' } }, 'QQ 机器人控制台'),
            h('span', { key: 'sp', style: { flex: 1 } }),
            h('a', {
              key: 'ext',
              href: '/onebot-console',
              target: '_blank',
              rel: 'noreferrer',
              style: { fontSize: 12, color: '#6ab0f3', textDecoration: 'none', marginRight: 8 },
            }, '新窗口'),
            h('button', {
              key: 'close',
              type: 'button',
              onClick: () => setOpen(false),
              style: {
                border: 'none', background: 'transparent', color: '#9aa4b2',
                fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
              },
            }, '×'),
          ]),
          h('iframe', {
            key: 'frame',
            src: '/onebot-console',
            title: 'QQ 机器人控制台',
            style: { flex: 1, width: '100%', border: 'none', background: '#0f1115' },
          }),
        ]),
      ]);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'onebot-console-float',
          order: 50,
          label: 'QQ 机器人控制台',
        }, FloatingConsole));
      },
    };
  },
});
