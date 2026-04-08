import React from 'react';

const AppInput = React.forwardRef(({ className = '', ...props }, ref) => {
  return <input ref={ref} className={`app-input ${className}`.trim()} {...props} />;
});

AppInput.displayName = 'AppInput';

export default AppInput;
