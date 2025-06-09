import { toEqualAttribute, toEqualAttributes, toHaveAttribute } from './attributes';
import { toHaveClass, toHaveClasses, toMatchClasses } from './class-list';
import {
  toHaveFirstReceivedEventDetail,
  toHaveLastReceivedEventDetail,
  toHaveNthReceivedEventDetail,
  toHaveReceivedEvent,
  toHaveReceivedEventDetail,
  toHaveReceivedEventTimes,
} from './events';
import { toEqualHtml, toEqualLightHtml } from './html';
import { toMatchScreenshot } from './screenshot';
import { toEqualText } from './text';

export const expectExtend = {
  toEqualAttribute,
  toEqualAttributes,
  toEqualHtml,
  toEqualLightHtml,
  toEqualText,
  toHaveAttribute,
  toHaveClass,
  toHaveClasses,
  toMatchClasses,
  toHaveReceivedEvent,
  toHaveReceivedEventDetail,
  toHaveReceivedEventTimes,
  toHaveFirstReceivedEventDetail,
  toHaveLastReceivedEventDetail,
  toHaveNthReceivedEventDetail,
  toMatchScreenshot,
};
