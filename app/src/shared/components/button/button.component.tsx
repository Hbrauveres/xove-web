import { Link } from "react-router";
import styles from "./button.component.module.css";
import type { ButtonProps } from "./types/button.types";
import { buttonClasses, isButtonLink } from "./utils/button-classes.util";

/** The app's text button, in five looks and two sizes; a link with its look when it goes somewhere. */
export function Button(props: ButtonProps) {
  if (isButtonLink(props)) {
    const { variant, size, className, to, children, ...rest } = props;
    const classes = buttonClasses(styles, variant, size, className);
    if (to !== undefined)
      return (
        <Link to={to} className={classes} {...rest}>
          {children}
        </Link>
      );
    return (
      <a className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const { variant, size, className, to: _to, href: _href, ...rest } = props;
  return <button type="button" className={buttonClasses(styles, variant, size, className)} {...rest} />;
}
