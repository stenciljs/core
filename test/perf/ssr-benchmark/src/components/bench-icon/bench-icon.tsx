import { Component, Host, Prop } from '@stencil/core';

const PATHS: Record<string, string[]> = {
  star: ['M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z'],
  heart: [
    'M12 21l-1.5-1.3C5 15 2 12 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.5-3 6.5-8.5 11.2z',
  ],
  chevron: ['M9 6l6 6-6 6', 'M4 12h1'],
};

@Component({
  tag: 'bench-icon',
  styleUrl: 'bench-icon.css',
  encapsulation: { type: 'shadow' },
})
export class BenchIcon {
  @Prop({ reflect: true }) name = 'star';
  @Prop({ reflect: true }) size?: 'small' | 'large';

  render() {
    return (
      <Host role='img' aria-label={this.name} class={{ [`icon-${this.size}`]: !!this.size }}>
        <svg class='icon-inner' viewBox='0 0 24 24' width='24' height='24'>
          {(PATHS[this.name] ?? PATHS.star).map((d) => (
            <path d={d} fill='none' stroke='currentColor' stroke-width='2' />
          ))}
        </svg>
      </Host>
    );
  }
}
