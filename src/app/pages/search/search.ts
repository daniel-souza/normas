import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchFilters } from './components/search-filters';
import { SearchResults } from './components/search-results';

@Component({
  selector: 'app-search',
  imports: [RouterLink, SearchFilters, SearchResults],
  templateUrl: './search.html',
  styleUrl: './search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search {}
