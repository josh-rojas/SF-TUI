import React from 'react';
import { Box, Text } from 'ink';

type BreadcrumbItem = {
  label: string;
  active?: boolean;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="row" marginBottom={1}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <Text
            color={item.active ? 'cyan' : 'gray'}
            bold={item.active}
          >
            {item.label}
          </Text>
          {index < items.length - 1 && <Text color="gray"> › </Text>}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default Breadcrumb;
