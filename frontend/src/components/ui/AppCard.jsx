import React from 'react';

const AppCard = ({ className = '', children, as: Component = 'div', ...props }) => {
  return (
    <Component className={`app-card ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
};

export default AppCard;
