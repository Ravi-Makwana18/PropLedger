import React from 'react';

const AppTextarea = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <textarea ref={ref} className={`app-input ${className}`.trim()} {...props}>
      {children}
    </textarea>
  );
});

AppTextarea.displayName = 'AppTextarea';

export default AppTextarea;
