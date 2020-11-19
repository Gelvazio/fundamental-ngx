import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    QueryList,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { WizardStepComponent } from './wizard-step/wizard-step.component';
import { Subscription } from 'rxjs';

export const STEP_MIN_WIDTH = 168;
export const STEP_STACKED_TOP_CLASS = 'fd-wizard__step--stacked-top';
export const STEP_STACKED_CLASS = 'fd-wizard__step--stacked';
export const STEP_NO_LABEL_CLASS = 'fd-wizard__step--no-label';

export const WIZARD_CLASS = 'fd-wizard';
export const WIZARD_NAVIGATION_CLASS = 'fd-wizard__navigation';
export const WIZARD_CONTENT_CLASS = 'fd-wizard__content';
export const WIZARD_CONTAINER_WRAPPER_CLASS = 'fd-wizard-container-wrapper';
export const WIZARD_TALL_CONTENT_CLASS = 'fd-wizard-tall-content';
export const SHELLBAR_CLASS = 'fd-shellbar';
export const BAR_FOOTER_CLASS = 'fd-bar--footer';

export const ACTIVE_STEP_STATUS = 'active';
export const CURRENT_STEP_STATUS = 'current';
export const UPCOMING_STEP_STATUS = 'upcoming';
export const COMPLETED_STEP_STATUS = 'completed';

export const HEADER_HEIGHT = 64;

@Component({
    selector: 'fd-wizard',
    templateUrl: './wizard.component.html',
    styleUrls: ['./wizard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardComponent implements AfterViewInit, OnDestroy {
    /**
     * Whether or not to append the step to the wizard. If false, each step will be displayed on a different page.
     * Default is true.
     */
    @Input()
    appendToWizard = true;

    /**
     * Custom height to use for the wizard's content pane. By default, this value is calc(100vh - 144px), where 144px
     * is the combined height of the shellbar, wizard header and wizard footer.
     */
    @Input()
    contentHeight: string;

    /** @hidden */
    @ContentChildren(WizardStepComponent, { descendants: true })
    steps: QueryList<WizardStepComponent>;

    /** @hidden */
    @ViewChild('wrapperContainer')
    wrapperContainer: ElementRef<HTMLElement>;

    /** @hidden */
    contentTemplates: TemplateRef<any>[] = [];

    /** @hidden */
    private _subscriptions: Subscription = new Subscription();

    /** @hidden */
    private _previousWidth: number;

    /** @hidden */
    private _fromScrollToCurrentStep = false;

    constructor(private _elRef: ElementRef, private _cdRef: ChangeDetectorRef, private _renderer: Renderer2) {}

    /** @hidden */
    @HostListener('window:resize')
    resizeHandler(): void {
        const wizardWidth = this._elRef.nativeElement.getBoundingClientRect().width;
        if (!this._previousWidth || wizardWidth <= this._previousWidth) {
            this._wizardShrinking();
        } else if (wizardWidth > this._previousWidth) {
            this._shrinkWhileAnyStepIsTooNarrow();
        }
        this._previousWidth = wizardWidth;
        if (this.contentHeight) {
            this._elRef.nativeElement.querySelector('.' + WIZARD_CONTAINER_WRAPPER_CLASS).style.height = this.contentHeight;
        } else {
            this._setContainerAndTallContentHeight();
        }
    }

    /** @hidden */
    ngAfterViewInit(): void {
        setTimeout(() => {
            // fixes ExpressionChangedAfterItHasBeenCheckedError
            this._setContentTemplates();
            this._subscriptions.add(
                this.steps.changes.subscribe(() => {
                    this._handleStepOrStatusChanges();
                })
            );
            this.steps.forEach((step) => {
                this._setupStepEvents(step);
            });
            this._cdRef.detectChanges();
        });
        this.resizeHandler();
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._subscriptions.unsubscribe();
    }

    /**
     * @hidden
     * @private
     * This function determines the height of the wizard content by looking for the document's shellbar, the wizard
     * navigation and the wizard footer, and calculating the height based on their presence.
     */
    private _calculateContentHeight(): number {
        let shellbarHeight = 0, wizardNavHeight = 0, wizardFooterHeight = 0;
        if (document.querySelector<HTMLElement>('.' + SHELLBAR_CLASS)) {
            shellbarHeight = document.querySelector<HTMLElement>('.' + SHELLBAR_CLASS).clientHeight;
        }
        const wizard = this._elRef.nativeElement.querySelector('.' + WIZARD_CLASS);
        if (wizard.querySelector('.' + WIZARD_NAVIGATION_CLASS)) {
            wizardNavHeight = wizard.querySelector('.' + WIZARD_NAVIGATION_CLASS).clientHeight;
        }
        if (wizard.querySelector('.' + BAR_FOOTER_CLASS)) {
            wizardFooterHeight = wizard.querySelector('.' + BAR_FOOTER_CLASS).clientHeight;
        }
        return shellbarHeight + wizardNavHeight + wizardFooterHeight;
    }

    /** @hidden */
    private _setContainerAndTallContentHeight(): void {
        const wizard = this._elRef.nativeElement.querySelector('.' + WIZARD_CLASS);
        const combinedHeight = this.contentHeight ? this.contentHeight : this._calculateContentHeight();
        if (wizard.querySelector('.' + WIZARD_CONTAINER_WRAPPER_CLASS)) {
            wizard.querySelector('.' + WIZARD_CONTAINER_WRAPPER_CLASS).style.height = 'calc(100vh - ' + combinedHeight + 'px)';
        }
        wizard.querySelectorAll('.' + WIZARD_CONTENT_CLASS).forEach(node => {
            node.style.height = 'auto'
        });
        if (wizard.querySelector('.' + WIZARD_TALL_CONTENT_CLASS)) {
            wizard.querySelector('.' + WIZARD_TALL_CONTENT_CLASS).style.height = 'calc(100vh - ' + combinedHeight + 'px)';
        }
    }

    /** @hidden */
    private _setupStepEvents(step: WizardStepComponent): void {
        this._subscriptions.add(
            step.stepClicked.subscribe((event) => {
                this._stepClicked(event);
            })
        );
        this._subscriptions.add(
            step.statusChange.subscribe(() => {
                this._handleStepOrStatusChanges();
            })
        );
        // need to call wizardShrinking for each step < 168px on first load
        if (step.wizardLabel && step.getStepClientWidth() < STEP_MIN_WIDTH) {
            this._wizardShrinking();
        }
    }

    /** @hidden */
    private _wizardShrinking(): void {
        this.steps.forEach((step) => {
            if (step.status === ACTIVE_STEP_STATUS || step.status === CURRENT_STEP_STATUS) {
                const currentStep = step;
                if (step.wizardLabel && step.getStepClientWidth() < STEP_MIN_WIDTH) {
                    this._hideSomeStep(currentStep);
                }
            }
        });
    }

    /** @hidden */
    private _setContentTemplates(): void {
        const templatesLength = this.contentTemplates.length;
        this.contentTemplates = [];
        let stepId = 0;
        this.steps.forEach((step) => {
            if (step.content) {
                step.content.tallContent = false;
                step.content.wizardContentId = stepId.toString();
            }
            step.stepId = stepId;
            stepId++;
            step.finalStep = false;
            if (step.visited) {
                step.content.nextStep.getElRef().nativeElement.style.display = 'none';
            }
            if (
                step.visited ||
                ((step.status === CURRENT_STEP_STATUS || step.status === COMPLETED_STEP_STATUS) && step.content)
            ) {
                if (step.status === CURRENT_STEP_STATUS && !step.visited) {
                    step.content.tallContent = true;
                }
                step.visited = true;
                if (!templatesLength || (!this.appendToWizard && step.status === CURRENT_STEP_STATUS)) {
                    this.contentTemplates = [step.content.contentTemplate];
                } else {
                    this.contentTemplates.push(step.content.contentTemplate);
                }
            }
        });
        if (this.steps.last.content) {
            this.steps.last.content.tallContent = true;
        }
        this.steps.last.finalStep = true;
    }

    /** @hidden */
    private _scrollToCurrentStep(): void {
        this._fromScrollToCurrentStep = true;
        let child: HTMLElement;
        this.steps.forEach((step, index) => {
            if (step.status === CURRENT_STEP_STATUS) {
                child = <HTMLElement>this.wrapperContainer.nativeElement.children[index];
                this.wrapperContainer.nativeElement.scrollTo({
                    top: child.offsetTop - HEADER_HEIGHT,
                    behavior: 'smooth'
                });
            }
        });
        this._setUpScrollListener();
    }

    /** @hidden */
    private _setUpScrollListener(): void {
        let timer = null;
        this.wrapperContainer.nativeElement.addEventListener('scroll', () => {
            if (timer !== null) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                this._fromScrollToCurrentStep = false;
            }, 150);
        }, false);
    }

    /** @hidden */
    private _hideSomeStep(currentStep: WizardStepComponent): void {
        // If a small step was found, get the step with a visible label furthest away from the current step and hide the label
        let stepsArray = this.steps.toArray();
        stepsArray = stepsArray.filter((step) => {
            return !step.hasLabel(STEP_NO_LABEL_CLASS);
        });
        if (stepsArray.length > 1) {
            let currentStepIndex = 0,
                stepToHide;
            if (currentStep) {
                currentStepIndex = stepsArray.indexOf(currentStep);
            }
            currentStepIndex > (stepsArray.length - 1) / 2
                ? (stepToHide = stepsArray[0])
                : (stepToHide = stepsArray[stepsArray.length - 1]);
            stepToHide.getClassList().add(STEP_NO_LABEL_CLASS);
            stepToHide.getClassList().add(STEP_STACKED_CLASS);
            this._setStackedTop(currentStep);
        }
    }

    /** @hidden */
    private _setStackedTop(currentStep: WizardStepComponent): void {
        this.steps.forEach((step, index) => {
            step.getClassList().remove(STEP_STACKED_TOP_CLASS);
            if (this.steps.toArray()[index + 1] === currentStep) {
                step.getClassList().add(STEP_STACKED_TOP_CLASS);
            }
        });
    }

    /** @hidden */
    private _resetStepClasses(): void {
        this.steps.forEach((step) => {
            step.getClassList().remove(STEP_STACKED_TOP_CLASS);
            step.getClassList().remove(STEP_STACKED_CLASS);
            step.getClassList().remove(STEP_NO_LABEL_CLASS);
        });
    }

    /** @hidden */
    private _handleStepOrStatusChanges(): void {
        this._setContentTemplates();
        this._shrinkWhileAnyStepIsTooNarrow();
        this._cdRef.detectChanges();
        this._setContainerAndTallContentHeight();
        this._scrollToCurrentStep();
    }

    /** @hidden */
    private _shrinkWhileAnyStepIsTooNarrow(): void {
        this._resetStepClasses();
        let i = 0;
        while (this._anyStepIsTooNarrow() && i < this.steps.length - 1) {
            i++;
            this._wizardShrinking();
        }
    }

    /** @hidden */
    private _anyStepIsTooNarrow(): boolean {
        return this.steps.some((step) => step.getStepClientWidth() < STEP_MIN_WIDTH);
    }

    /** @hidden */
    private _stepClicked(clickedStep: WizardStepComponent): void {
        const clickedStepIndex = this.steps.toArray().indexOf(clickedStep);
        this.steps.forEach((step) => {
            if (step === clickedStep) {
                step.status = CURRENT_STEP_STATUS;
                step.statusChange.emit(CURRENT_STEP_STATUS);
            } else if (step !== clickedStep) {
                if (this.steps.toArray().indexOf(step) < clickedStepIndex) {
                    step.status = COMPLETED_STEP_STATUS;
                    step.statusChange.emit(COMPLETED_STEP_STATUS);
                } else if (this.steps.toArray().indexOf(step) > clickedStepIndex) {
                    step.status = UPCOMING_STEP_STATUS;
                    step.statusChange.emit(UPCOMING_STEP_STATUS);
                }
            }
        });
    }

    /** @hidden */
    scrollSpyChange($event: string): void {
        if (!this._fromScrollToCurrentStep) {
            this.steps.forEach((step) => {
                if (step.stepId.toString() === $event) {
                    step.status = CURRENT_STEP_STATUS;
                } else if (step.stepId < parseInt($event, 10)) {
                    step.status = COMPLETED_STEP_STATUS;
                } else {
                    step.status = UPCOMING_STEP_STATUS;
                }
            });
        }
    }
}
