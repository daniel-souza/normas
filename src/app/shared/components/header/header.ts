import { Component } from '@angular/core';
import {
  BrHeader,
  BrHeaderLogo,
  BrHeaderList,
  BrHeaderFunction,
  BrSignIn,
} from '@govbr-ds/webcomponents-angular/standalone';

@Component({
  imports: [
    BrHeader,
    BrHeaderLogo,
    BrHeaderList,
    BrHeaderFunction,
    BrSignIn,
  ],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {}
