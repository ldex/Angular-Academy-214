import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, delay, first, map, mergeAll, shareReplay, tap } from 'rxjs/operators';
import { Product } from './product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = 'https://storerestservice.azurewebsites.net/api/products/';
  private products = new BehaviorSubject<Product[]>([]);
  products$: Observable<Product[]> = this.products.asObservable();
  mostExpensiveProduct$: Observable<Product>;
  productsTotalNumber$: Observable<number>;

  constructor(private http: HttpClient) { 
    this.initProducts();
    this.initMostExpensiveProduct();
    this.initProductsTotalNumber();
  }

  initProducts(skip: number = 0, take: number = 10) {
    let url = this.baseUrl + `?$skip=${skip}&$top=${take}&$orderby=ModifiedDate%20desc`;

    this
      .http
      .get<Product[]>(url)
      .pipe(
        delay(1500),
        tap(console.table),
        shareReplay()
      )
      .subscribe(
        newProducts => {
          let currentProducts = this.products.value;
          let mergedProducts = currentProducts.concat(newProducts);
          this.products.next(mergedProducts);
        }
      );
  }

  initProductsTotalNumber() {
    this.productsTotalNumber$ = this
                                  .http
                                  .get<number>(this.baseUrl + "count")
                                  .pipe(
                                    shareReplay()
                                  );
  }

  private initMostExpensiveProduct() {
    this.mostExpensiveProduct$ =
      this
      .products$  
      .pipe(        
        map(products => [...products].sort((p1, p2) => p1.price > p2.price ? -1 : 1)),   
        // [{}, {}, {}]
        mergeAll(),
        // {}, {}, {}
        first()
      )
  }    

  insertProduct(newProduct: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, newProduct).pipe(delay(2000));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + id);           
  }
}
