const Input = ({ label, type = 'text', ...props }) => {
  return (
    <div className='space-y-1'>
      {label && <label className='text-sm font-medium text-gray-700'>{label}</label>}
      <input
        type={type}
        className='w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-500'
        {...props}
      />
    </div>
  );
}

export default Input;
