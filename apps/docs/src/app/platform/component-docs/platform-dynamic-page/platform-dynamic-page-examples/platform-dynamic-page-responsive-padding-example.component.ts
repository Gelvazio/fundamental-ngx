import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { DynamicPageCollapseChangeEvent } from '@fundamental-ngx/platform';

@Component({
    selector: 'fdp-dynamic-page-responsive-padding-example',
    templateUrl: './platform-dynamic-page-responsive-padding-example.component.html',
    styleUrls: ['./platform-dynamic-page-responsive-padding-example.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformDynamicPageResponsivePaddingExampleComponent {
    @ViewChild('overlay')
    overlay: ElementRef<HTMLElement>;

    fullscreen = false;

    pageTitle = 'Balenciaga Tripple S Trainers';

    onCollapseChange(event: DynamicPageCollapseChangeEvent): void {
        console.log('collapse changed');
    }

    resizeClicked(event: Event): void {
        event.stopPropagation();
    }

    openPage(): void {
        this.fullscreen = true;
        this.overlay.nativeElement.style.width = '100%';
    }
    closePage(event: Event): void {
        event.stopPropagation();
        this.fullscreen = false;
        this.overlay.nativeElement.style.width = '0%';
    }
}
