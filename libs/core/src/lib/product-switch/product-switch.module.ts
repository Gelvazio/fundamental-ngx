import { NgModule } from '@angular/core';
import { ProductSwitchComponent } from './product-switch/product-switch.component';
import { PopoverModule } from '../popover/popover.module';
import { ButtonModule } from '../button/button.module';
import { CommonModule } from '@angular/common';
import { DragAndDropModule } from '../utils/drag-and-drop/drag-and-drop.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ProductSwitchBodyComponent } from './product-switch-body/product-switch-body.component';

@NgModule({
    imports: [PopoverModule, CommonModule, ButtonModule, DragAndDropModule, DragDropModule],
    declarations: [ProductSwitchComponent, ProductSwitchBodyComponent],
    exports: [ProductSwitchComponent, ProductSwitchBodyComponent]
})
export class ProductSwitchModule {}
