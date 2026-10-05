import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchStore } from '../search-store';

@Component({
  selector: 'app-search-results',
  imports: [DatePipe, RouterLink],
  templateUrl: './search-results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResults {
  readonly store = inject(SearchStore);
}
