import React from 'react';
import Button from './Button';

interface NumberedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

const NumberedPagination: React.FC<NumberedPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems,
  itemsPerPage,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const maxVisible = 5;
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near beginning: 1, 2, 3, 4, ..., last
        for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push('...');
        }
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near end: 1, ..., last-3, last-2, last-1, last
        if (totalPages > 4) {
          pages.push('...');
        }
        for (let i = Math.max(2, totalPages - 3); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1, ..., current-1, current, current+1, ..., last
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onPageChange(page);
    // Scroll to top when page changes
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showInfo && totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          disabled={currentPage <= 1}
          onClick={(e) => handlePageChange(1, e)}
          size="sm"
        >
          First
        </Button>
        
        <Button
          variant="ghost"
          disabled={currentPage <= 1}
          onClick={(e) => handlePageChange(currentPage - 1, e)}
          size="sm"
        >
          Previous
        </Button>
        
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "primary" : "ghost"}
                onClick={(e) => handlePageChange(page as number, e)}
                size="sm"
                className="min-w-[32px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="ghost"
          disabled={currentPage >= totalPages}
          onClick={(e) => handlePageChange(currentPage + 1, e)}
          size="sm"
        >
          Next
        </Button>
        
        <Button
          variant="ghost"
          disabled={currentPage >= totalPages}
          onClick={(e) => handlePageChange(totalPages, e)}
          size="sm"
        >
          Last
        </Button>
      </div>
    </div>
  );
};

export default NumberedPagination;