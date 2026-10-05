import { Component } from '@angular/core';
import {
  BrFooter,
  BrFooterLogo,
  BrFooterCategory,
  BrFooterItem,
  BrFooterSocial,
  BrFooterLegal
} from '@govbr-ds/webcomponents-angular/standalone';

@Component({
  imports: [BrFooter, BrFooterLogo, BrFooterCategory, BrFooterItem, BrFooterSocial, BrFooterLegal],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {}
