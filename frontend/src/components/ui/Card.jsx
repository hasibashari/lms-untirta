const Card = ({ title, children }) => {
  return (
    <div className='bg-white rounded shadow p-4'>
      {title && <h2 className='text-lg font-semibold mb-3'>{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
