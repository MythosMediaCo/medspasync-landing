(function(){
  const { useEffect, useState } = React;
  function UsageMeter({ used = 0, total = 7, signupUrl = '/signup' }) {
    const percent = Math.min(100, (used / total) * 100);
    const reached = used >= total;
    const warn = !reached && used >= total - 1;
    const barColor = reached ? 'bg-red-500' : warn ? 'bg-yellow-500' : 'bg-blue-500';
    const message = reached
      ? 'Demo limit reached. '
      : 'Almost out of free demos! ';
    return React.createElement('div', null,
      React.createElement('div', { className: 'text-sm font-medium text-center mb-1' }, `${used} of ${total} free demos used`),
      React.createElement('div', { className: 'w-full bg-gray-200 rounded h-2 overflow-hidden' },
        React.createElement('div', {
          className: `h-full ${barColor}`,
          style: { width: percent + '%' }
        })
      ),
      (warn || reached) && React.createElement('div', { className: 'mt-2 text-center text-sm text-red-600' },
        message,
        React.createElement('a', { href: signupUrl, className: 'underline text-blue-600' }, 'Sign up now')
      )
    );
  }

  window.renderUsageMeter = function(used){
    const container = document.getElementById('usageMeter');
    if(!container || !ReactDOM.createRoot) return;
    if(!window._usageRoot) {
      window._usageRoot = ReactDOM.createRoot(container);
    }
    window._usageRoot.render(React.createElement(UsageMeter,{ used }));
  };
})();
