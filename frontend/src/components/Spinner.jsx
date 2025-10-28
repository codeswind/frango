import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', overlay = false }) => {
  const spinnerContent = (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-circle"></div>
    </div>
  );

  if (overlay) {
    return (
      <div className="spinner-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default Spinner;
