const React = require('react');

/**
 * Verification Badge Component
 * Displays verification status of crypto domains and tokens
 */
const VerificationBadge = ({
  isVerified = false,
  domain = null,
  size = 'medium',
  customStyle = {},
  verifiedText = 'Verified',
  unverifiedText = 'Unverified',
  onClick = null,
}) => {
  const sizes = {
    small: { height: '20px', fontSize: '10px', padding: '4px 8px' },
    medium: { height: '24px', fontSize: '12px', padding: '4px 10px' },
    large: { height: '32px', fontSize: '14px', padding: '6px 16px' }
  };
  
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    ...sizes[size]
  };
  
  const verifiedStyle = {
    backgroundColor: '#10B981',
    color: 'white',
  };
  
  const unverifiedStyle = {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  };
  
  const style = {
    ...baseStyle,
    ...(isVerified ? verifiedStyle : unverifiedStyle),
    ...customStyle
  };
  
  const handleClick = (e) => {
    if (onClick) {
      onClick(e, { isVerified, domain });
    }
  };
  
  const renderIcon = () => {
    if (isVerified) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    }
    return null;
  };

  return (
    <div style={style} onClick={handleClick} title={domain ? `Domain: ${domain}` : ''}>
      {renderIcon()}
      <span>{isVerified ? verifiedText : unverifiedText}</span>
      {domain && <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>{`(${domain})`}</span>}
    </div>
  );
};

module.exports = VerificationBadge;
