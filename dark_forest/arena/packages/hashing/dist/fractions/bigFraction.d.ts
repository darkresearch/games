/**
 * @license Fraction.js v4.0.12 09/09/2015
 * http://www.xarg.org/2014/03/rational-numbers-in-javascript/
 *
 * Copyright (c) 2015, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
/**
 *
 * This class offers the possibility to calculate fractions.
 * You can pass a fraction in different formats. Either as array, as double, as string or as an integer.
 *
 * Array/Object form
 * [ 0 => <nominator>, 1 => <denominator> ]
 * [ n => <nominator>, d => <denominator> ]
 *
 * Integer form
 * - Single integer value
 *
 * Double form
 * - Single double value
 *
 * String form
 * 123.456 - a simple double
 * 123/456 - a string fraction
 * 123.'456' - a double with repeating decimal places
 * 123.(456) - synonym
 * 123.45'6' - a double with repeating last place
 * 123.45(6) - synonym
 *
 * Example:
 *
 * let f = new Fraction("9.4'31'");
 * f.mul([-4, 3]).div(4.9);
 *
 */
import { BigInteger } from 'big-integer';
export interface NumeratorDenominator {
    n: number;
    d: number;
}
declare type FractionConstructor = {
    (fraction: IFraction): IFraction;
    (num: number | string): IFraction;
    (numerator: number, denominator: number): IFraction;
    (numbers: (number | string)[]): IFraction;
    (fraction: NumeratorDenominator): IFraction;
};
export interface IFraction {
    new (fraction: IFraction): any;
    new (num: number | string): any;
    new (numerator: number, denominator: number): any;
    new (numbers: (number | string)[]): any;
    new (fraction: NumeratorDenominator): any;
    s: BigInteger;
    n: BigInteger;
    d: BigInteger;
    abs(): IFraction;
    neg(): IFraction;
    add: FractionConstructor;
    sub: FractionConstructor;
    mul: FractionConstructor;
    div: FractionConstructor;
    pow: FractionConstructor;
    gcd: FractionConstructor;
    lcm: FractionConstructor;
    mod(n?: number | string | IFraction): IFraction;
    ceil(places?: number): IFraction;
    floor(places?: number): IFraction;
    round(places?: number): IFraction;
    inverse(): IFraction;
    simplify(eps?: number): IFraction;
    equals(n: number | string | IFraction): boolean;
    compare(n: number | string | IFraction): number;
    divisible(n: number | string | IFraction): boolean;
    valueOf(): number;
    toString(decimalPlaces?: number): string;
    toLatex(excludeWhole?: boolean): string;
    toFraction(excludeWhole?: boolean): string;
    toContinued(): number[];
    clone(): IFraction;
}
declare const Fraction: IFraction, errorConstructor: () => void;
export { Fraction, errorConstructor };
