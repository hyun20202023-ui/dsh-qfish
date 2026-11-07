window.__ModuleLoader__.load({
  id: 'qfish',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;
    const IMG = 'data:image/png;base64,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';

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
        title: '大肥鱼',
        'aria-label': '大肥鱼',
        onClick: () => setOpen((v) => !v),
        style: {
          position: 'fixed',
          right: 18,
          bottom: 18,
          width: 88,
          height: 88,
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,.65)',
          background: 'rgba(235,244,255,.26)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          boxShadow: '0 10px 30px rgba(31,38,60,.22), inset 0 1px 0 rgba(255,255,255,.85)',
          cursor: 'pointer',
          zIndex: 2147483000,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'hidden',
          transition: 'transform .18s ease',
        },
        onMouseEnter: (e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; },
        onMouseLeave: (e) => { e.currentTarget.style.transform = 'none'; },
      }, h('img', {
        key: 'img',
        src: IMG,
        alt: '',
        draggable: false,
        style: { width: '116%', height: '116%', objectFit: 'contain', pointerEvents: 'none', transform: 'translate(5%, -3%)' },
      }));

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
            src: '/onebot-console?v=' + Date.now(),
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
