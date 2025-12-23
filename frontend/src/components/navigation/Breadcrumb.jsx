import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="text-sm text-gray-600">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center space-x-2">
              {!isLast ? (
                <Link
                  to={item.to}
                  className="hover:underline text-blue-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-800 font-medium">
                  {item.label}
                </span>
              )}

              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
