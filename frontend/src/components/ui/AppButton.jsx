import React from 'react';

const AppButton = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <button ref={ref} className={`app-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
});

AppButton.displayName = 'AppButton';

export default AppButton;
