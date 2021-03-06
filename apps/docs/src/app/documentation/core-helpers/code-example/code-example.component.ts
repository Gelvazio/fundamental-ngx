import {
    Component,
    ElementRef,
    HostListener,
    Input,
    OnInit,
    QueryList,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import { CopyService } from '../../services/copy.service';
import { ExampleFile } from './example-file';
import { height } from '../../utilities/animations/collapse';
import { AlertConfig, AlertService } from '@fundamental-ngx/core';
import { StackblitzService } from '../stackblitz/stackblitz.service';
import { CodeSnippetComponent } from '../code-snippet/code-snippet.component';

@Component({
    selector: 'code-example',
    templateUrl: './code-example.component.html',
    styleUrls: ['./code-example.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [height({ time: 200 })]
})
export class CodeExampleComponent implements OnInit {
    @ViewChildren(CodeSnippetComponent)
    codeElements: QueryList<ElementRef>;

    /**
     * List of files to display in this code example.
     */
    @Input()
    exampleFiles: ExampleFile[] = [];
    smallScreen: boolean;
    selectedFileIndex = 0;

    isOpen = false;

    constructor(
        private element: ElementRef,
        private copyService: CopyService,
        private alertService: AlertService,
        private stackBlitzService: StackblitzService
    ) { }

    openStackBlitz(): void {
        this.stackBlitzService.openCode(this.exampleFiles);
    }

    get expandIcon(): string {
        return this.isOpen ? 'navigation-up-arrow' : 'navigation-down-arrow';
    }

    copyText(): void {
        this.copyService.copyText(this.exampleFiles[this.selectedFileIndex].code.default);
        this.alertService.open('Code copied!', { type: 'success', duration: 5000 } as AlertConfig);
    }

    ngOnInit(): void {
        this.smallScreen = window.innerWidth <= 768;
    }

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.smallScreen = window.innerWidth <= 768;
    }
}
