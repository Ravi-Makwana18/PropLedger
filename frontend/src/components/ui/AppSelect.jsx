import React from 'react';

const AppSelect = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <select ref={ref} className={`app-input ${className}`.trim()} {...props}>
      {children}
    </select>
  );
});

AppSelect.displayName = 'AppSelect';

export default AppSelect;
