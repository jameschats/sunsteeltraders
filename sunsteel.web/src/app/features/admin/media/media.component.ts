import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MediaBrowserComponent } from './media-browser.component';

@Component({
  selector: 'ss-media',
  imports: [MediaBrowserComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-[22px] font-medium">Media library</h1>
      <p class="mt-0.5 text-[13.5px] text-[#6B7485]">Every photo and video on the website. Upload here, then choose them on a page from <b class="font-medium">Pages &amp; content</b>.</p>
    </header>
    <ss-media-browser mode="manage" kind="any" />`,
})
export class MediaComponent {}
