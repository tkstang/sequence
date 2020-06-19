import PropTypes from 'prop-types';
import Link from 'next/link';
import ButtonStyles from './Button.styles';

const Button = ({ children, type, href, onKeyPress, onClick }) => {
  if (href) {
    return (
      <Link href={href}>
        <ButtonStyles type={type} onClick={onClick} onKeyPress={onKeyPress}>
          {children}
        </ButtonStyles>
      </Link>
    );
  }
  return (
    <ButtonStyles type={type} onClick={onClick} onKeyPress={onKeyPress}>
      {children}
    </ButtonStyles>
  );
};

Button.propTypes = {
  type: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
  onKeyPress: PropTypes.func,
};

Button.defaultProps = {
  type: 'submit',
  href: null,
  onClick: () => {},
  onKeyPress: () => {},
};

export default Button;
