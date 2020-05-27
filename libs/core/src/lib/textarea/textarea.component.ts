import {
    Component,
    OnInit,
    Input,
    ElementRef,
    ViewChild,
    OnChanges,
    forwardRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    HostListener
} from '@angular/core';
import { CssClassBuilder, applyCssClass } from '../utils/public_api';
import { FormStates } from '../form/form-control/form-states';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;
export type WrapType = 'hard' | 'soft';

@Component({
    selector: 'fd-textarea',
    templateUrl: './textarea.component.html',
    styleUrls: ['./textarea.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextareaComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaComponent implements OnChanges, OnInit, ControlValueAccessor {
    count: number = 10;
    // plural: string;
    private readonly remainingText = 'remaining';
    private readonly excessText = 'excess';
    counterExcessOrRemaining = this.remainingText;

    // /** @hidden */
    // class: string;

    /** @hidden */
    @ViewChild('textareaElement')
    textareaElement: ElementRef;
    /** Whether to apply compact mode to the radio button.
     * Value: true or false
     * By default field is set to false
     */
    @Input()
    compact: boolean;
    /**
     *  The state of the form control - applies css classes.
     *  Can be `success`, `error`, `warning`, `information` or blank for default.
     */
    @Input()
    state: FormStates;

    /** The field is used to tell if radio button should be disabled
     * Value: true or false
     * by default disabled state is set to false
     */
    @Input()
    disabled: boolean;

    @Input()
    readonly: boolean;

    @Input()
    maxLength: number;

    @Input()
    showExceededText: boolean = false;

    @Input()
    placeholder: boolean;

    @Input()
    growingMaxLines: string;

    @Input()
    height: string;

    @Input()
    cols: string;

    @Input()
    wrap: WrapType = 'soft';

    @Input()
    growing: boolean = false;

    @Input()
    textExceededMessage: string;

    /** @hidden */
    hasTextExceeded: boolean = false;

    /**
     * specify custom content to be filled by default
     *
     * TODO: does not work. is this even needed? Maybe not(16 apr)
     */
    // @Input()
    // customContent: string;

    /**
     * uniqueId to a radio button
     */
    @Input()
    id: string = `textarea-${uniqueId++}`;

    /** @hidden */
    textAreaValue: string;

    textAreaCharCount: number;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        // this.plural = 's';
    }

    /** @hidden */
    ngOnChanges(): void {}

    /** @hidden */
    onChange: any = () => {
        console.log('changed');
        // this.setPlural();
    };

    /** @hidden */
    onTouched: any = () => {};
    /** Get the value of the text input. */
    get textArea() {
        console.log('textArea():::this.textAreaValue' + this.textAreaValue);
        // this.updateCounterInteractions();

        return this.textAreaValue;
    }

    /** Set the value of the text input. */
    set textArea(value) {
        console.log('set textArea():::' + value);

        this.textAreaValue = value;

        this.onChange(value);
        this.onTouched();
    }

    writeValue(value: any): void {
        this.textAreaValue = value;
        console.log('writeValue():::' + this.textAreaValue);

        this.updateCounterInteractions();
        this.changeDetectorRef.markForCheck();
    }

    updateCounterInteractions(): void {
        if (this.textAreaValue) {
            this.textAreaCharCount = this.textAreaValue.length;
            this.validateLengthOnCustomSet();
            // this.setPlural();
        }
    }

    handlePasteInteraction(): void {
        console.log('handlePasteInteraction():::');
        /// For IE
        if (window['clipboardData']) {
            let value = window['clipboardData'].getData('Text');
            console.log(value);
            // todo: handle for IE
            // this.updateCounterInteractions();
        } else {
            // for other navigators
            navigator['clipboard'].readText().then(clipText => {
                console.log(clipText);
                this.updateCounterInteractions();
            });
        }
    }

    // setPlural(): any {
    //     this.textAreaCharCount = this.textAreaValue.length;
    //     if (this.textAreaCharCount - this.maxLength === 1 || this.maxLength - this.textAreaCharCount === 1) {
    //         this.plural = '';
    //     } else {
    //         this.plural = 's';
    //     }
    // }
    validateLengthOnCustomSet(): void {
        if (this.textAreaCharCount > this.maxLength) {
            console.log('validateLengthOnCustomSet():::exceeded. do something here');
            this.textareaElement.nativeElement.focus();
            // this.textareaElement.nativeElement.setSelectionRange(10, 20);
            this.textareaElement.nativeElement.setSelectionRange(this.maxLength, this.textAreaCharCount);
            this.counterExcessOrRemaining = this.excessText;
        } else {
            this.counterExcessOrRemaining = this.remainingText;
        }
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        console.log('setDisabledState()::: disabled');

        this.disabled = isDisabled;
        this.changeDetectorRef.markForCheck();
    }

    getUpdatedState(): string {
        if (
            ((this.textareaElement && this.textareaElement.nativeElement.value.length) ||
                (this.textAreaValue && this.textAreaValue.length)) > this.maxLength
        ) {
            this.hasTextExceeded = true; // set flag for error message to also change accordingly
            this.counterExcessOrRemaining = this.excessText;
            return this.state;
        }
        this.hasTextExceeded = false;
        this.counterExcessOrRemaining = this.remainingText;
        return 'none';
    }
    // @applyCssClass
    // /** This method is responsible for building a css class based on current state
    //  *  It is implementation of CssClassBuilder interface and
    //  *  should be used with @applyCssClass decorator
    //  */
    // buildComponentCssClass(): string {
    //     return ['fd-textarea', this.compact ? 'fd-textarea--compact' : ''].join(' ');
    // }

    /** @hidden */
    // elementRef(): ElementRef<any> {
    //     return this.textareaElement;
    // }

    /** @hidden */
    // private _setFocusOnNativeElement(): void {
    //     if (this.textareaElement) {
    //         this.textareaElement.nativeElement.focus();
    //     }
    // }
    // find a better way to do this, without manipulating nativeElement. Can we use calc?
    autoGrowTextArea() {
        if (this.growing && this.textAreaCharCount > parseInt(this.cols as string, 10)) {
            this.textareaElement.nativeElement.style.height = '0px'; // incorrect logic, 36px fiori3
            const maxHeightStr = parseInt(this.height as string, 10);
            // todo: handle padding and margin spaces also
            if (this.textareaElement.nativeElement.scrollHeight < maxHeightStr) {
                this.textareaElement.nativeElement.style.height =
                    this.textareaElement.nativeElement.scrollHeight + 'px';
            } else {
                this.textareaElement.nativeElement.style.height = this.height;
            }
            // e.target.style.height = e.target.scrollHeight + 'px';
        }
    }

    @HostListener('keyup', ['$event'])
    handleBackPress(event: KeyboardEvent) {
        console.log(event.key);
        // if not showing exceeded text message/interactions, and custom value set
        if (!this.showExceededText && (event.key === 'Delete' || event.key === 'Backspace')) {
            // for the custom value set and showExceededText=false case, on any key press, remove excess characters
            if (this.textAreaValue) {
                this.textAreaCharCount = this.textAreaValue.length;
                if (this.textAreaCharCount > this.maxLength) {
                    // remove excess characters
                    this.textAreaValue = this.textAreaValue.substring(0, this.maxLength);
                    this.counterExcessOrRemaining = this.remainingText;
                    // this.setPlural();
                }
            }
        } else {
            console.log('calling autogrow');
            this.autoGrowTextArea();
            // this.setPlural();
        }
    }
}
// todo : look for the textarea issue regarding autogrow and understand what customer is asking for