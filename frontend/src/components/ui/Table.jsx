import React from 'react';
import './Table.css';

const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="table-container">
      <table className={`table-root ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={`table-header ${className}`} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`table-body ${className}`} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr className={`table-row ${className}`} {...props}>
      {children}
    </tr>
  );
};

const TableHead = ({ children, className = '', ...props }) => {
  return (
    <th className={`table-head ${className}`} {...props}>
      {children}
    </th>
  );
};

const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={`table-cell ${className}`} {...props}>
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export default Table;
