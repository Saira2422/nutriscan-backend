const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return strength;
};

module.exports = { generateOTP, getPasswordStrength };
