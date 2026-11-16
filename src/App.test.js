import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/Viewport3D', () => () => <div data-testid="viewport" />);

test('shows the laboratory sign-in', () => {
  render(<App />);
  expect(screen.getByText(/Увійти в лабораторію/i)).toBeInTheDocument();
});
