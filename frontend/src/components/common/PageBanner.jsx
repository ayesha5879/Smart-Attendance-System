import React from 'react';

const PageBanner = ({ image, title, subtitle, height = 'h-36' }) => (
  <div className={`relative w-full ${height} rounded-2xl overflow-hidden mb-6`}
    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,20,40,0.65) 0%, rgba(10,20,40,0.35) 100%)' }} />
    <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-5">
      <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">{title}</h1>
      {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default PageBanner;
