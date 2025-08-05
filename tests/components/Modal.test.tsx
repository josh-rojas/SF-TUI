import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import Modal from '../../src/components/common/Modal';
import { Text } from 'ink';

describe('Modal', () => {
  it('renders content when open', () => {
    const { lastFrame } = render(
      <Modal isOpen title="Title">
        <Text>Hello</Text>
      </Modal>
    );
    const output = lastFrame();
    expect(output).toContain('Title');
    expect(output).toContain('Hello');
  });
});
