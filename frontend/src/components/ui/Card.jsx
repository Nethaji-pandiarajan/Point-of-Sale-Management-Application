import React from 'react';
import './Card.css';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', tag: Tag = 'h3', ...props }) => {
  return (
    <Tag className={`card-title ${className}`} {...props}>
      {children}
    </Tag>
  );
};

const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`card-description ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
export default Card;
