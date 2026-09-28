import * as chai from 'chai';

chai.should();

function registerExpectation(): void {
  const g =
    typeof globalThis !== 'undefined'
      ? (globalThis as any)
      : typeof window !== 'undefined'
        ? (window as any)
        : null;
  if (g && typeof g.expect === 'function') {
    try {
      const exp = g.expect();
      if (exp && typeof exp.nothing === 'function') {
        exp.nothing();
      }
    } catch {
      // outside Jasmine context or nothing() unsupported
    }
  }
}

export class ExceptionAssertion {
  constructor(public error: any) {
    registerExpectation();
  }

  public WithMessage(expectedMessage: string): this {
    chai.expect(this.error?.message || String(this.error)).to.include(expectedMessage);
    return this;
  }

  public get And(): this {
    return this;
  }
}

export class FluentAssertion<T> {
  private readonly actual: any;

  constructor(actual: T) {
    if (actual && actual instanceof FluentAssertion) {
      this.actual = (actual as any).actual;
    } else {
      this.actual = actual;
    }
    registerExpectation();
  }

  public Should(): this {
    return this;
  }

  public get And(): this {
    return this;
  }

  public Be(expected: any): this {
    chai.expect(this.actual).to.equal(expected);
    return this;
  }

  public NotBe(expected: any): this {
    chai.expect(this.actual).to.not.equal(expected);
    return this;
  }

  public BeEquivalentTo(expected: any): this {
    chai.expect(this.actual).to.deep.equal(expected);
    return this;
  }

  public BeNull(): this {
    chai.assert.isNull(this.actual);
    return this;
  }

  public NotBeNull(): this {
    chai.assert.isNotNull(this.actual);
    return this;
  }

  public BeDefined(): this {
    chai.assert.isDefined(this.actual);
    return this;
  }

  public BeUndefined(): this {
    chai.assert.isUndefined(this.actual);
    return this;
  }

  public BeTrue(): this {
    chai.assert.isTrue(this.actual as unknown as boolean);
    return this;
  }

  public BeFalse(): this {
    chai.assert.isFalse(this.actual as unknown as boolean);
    return this;
  }

  public BeEmpty(): this {
    chai.assert.isEmpty(this.actual as any);
    return this;
  }

  public NotBeEmpty(): this {
    chai.assert.isNotEmpty(this.actual as any);
    return this;
  }

  public HaveCount(expectedCount: number): this {
    chai.expect(this.actual).to.have.lengthOf(expectedCount);
    return this;
  }

  public Contain(substringOrItem: any): this {
    chai.expect(this.actual).to.include(substringOrItem);
    return this;
  }

  public NotContain(substringOrItem: any): this {
    chai.expect(this.actual).to.not.include(substringOrItem);
    return this;
  }

  public StartWith(prefix: string): this {
    chai.expect(this.actual).to.be.a('string');
    chai.assert.isTrue((this.actual as unknown as string).startsWith(prefix));
    return this;
  }

  public EndWith(suffix: string): this {
    chai.expect(this.actual).to.be.a('string');
    chai.assert.isTrue((this.actual as unknown as string).endsWith(suffix));
    return this;
  }

  public Match(regex: RegExp): this {
    chai.expect(this.actual).to.match(regex);
    return this;
  }

  public NotMatch(regex: RegExp): this {
    chai.expect(this.actual).to.not.match(regex);
    return this;
  }

  public BeGreaterThan(val: number): this {
    chai.expect(this.actual).to.be.above(val);
    return this;
  }

  public BeGreaterThanOrEqualTo(val: number): this {
    chai.expect(this.actual).to.be.at.least(val);
    return this;
  }

  public BeLessThan(val: number): this {
    chai.expect(this.actual).to.be.below(val);
    return this;
  }

  public BeLessThanOrEqualTo(val: number): this {
    chai.expect(this.actual).to.be.at.most(val);
    return this;
  }

  public BeInstanceOf(type: any): this {
    chai.expect(this.actual).to.be.instanceOf(type);
    return this;
  }

  public HaveBeenCalled(): this {
    const act = this.actual as any;
    if (act && (act.calls || act._isMockFunction || typeof act.mock === 'object')) {
      const callCount = act.calls ? act.calls.count() : (act.mock ? act.mock.calls.length : 0);
      chai.expect(callCount, 'Expected spy/mock to have been called').to.be.above(0);
    }
    return this;
  }

  public HaveBeenCalledWith(...args: any[]): this {
    const act = this.actual as any;
    if (act && act.calls) {
      expect(act).toHaveBeenCalledWith(...args);
    } else if (act && act._isMockFunction) {
      expect(act).toHaveBeenCalledWith(...args);
    }
    return this;
  }

  public HaveBeenCalledTimes(times: number): this {
    const act = this.actual as any;
    if (act && act.calls) {
      chai.expect(act.calls.count()).to.equal(times);
    } else if (act && act.mock) {
      chai.expect(act.mock.calls.length).to.equal(times);
    }
    return this;
  }

  public NotHaveBeenCalled(): this {
    const act = this.actual as any;
    if (act && act.calls) {
      chai.expect(act.calls.count(), 'Expected spy not to have been called').to.equal(0);
    } else if (act && act.mock) {
      chai.expect(act.mock.calls.length, 'Expected mock not to have been called').to.equal(0);
    }
    return this;
  }

  public Throw(expectedErrorOrMessage?: any): ExceptionAssertion {
    let thrownError: any = null;
    try {
      (this.actual as unknown as Function)();
    } catch (err) {
      thrownError = err;
    }
    chai.assert.isNotNull(thrownError, 'Expected function to throw an exception');
    if (expectedErrorOrMessage) {
      if (typeof expectedErrorOrMessage === 'string') {
        chai.expect(thrownError.message || String(thrownError)).to.include(expectedErrorOrMessage);
      } else if (typeof expectedErrorOrMessage === 'function') {
        chai.expect(thrownError).to.be.instanceOf(expectedErrorOrMessage);
      }
    }
    return new ExceptionAssertion(thrownError);
  }

  public async ThrowAsync(expectedErrorOrMessage?: any): Promise<ExceptionAssertion> {
    let thrownError: any = null;
    try {
      await (this.actual as unknown as Function)();
    } catch (err) {
      thrownError = err;
    }
    chai.assert.isNotNull(thrownError, 'Expected async function to reject/throw an exception');
    if (expectedErrorOrMessage) {
      if (typeof expectedErrorOrMessage === 'string') {
        chai.expect(thrownError.message || String(thrownError)).to.include(expectedErrorOrMessage);
      } else if (typeof expectedErrorOrMessage === 'function') {
        chai.expect(thrownError).to.be.instanceOf(expectedErrorOrMessage);
      }
    }
    return new ExceptionAssertion(thrownError);
  }
}

declare global {
  interface Object {
    Should(): FluentAssertion<this>;
  }
}

if (!Object.prototype.hasOwnProperty('Should')) {
  Object.defineProperty(Object.prototype, 'Should', {
    value: function () {
      return new FluentAssertion(this);
    },
    configurable: true,
    writable: true,
  });
}

export function Should<T>(actual: T): FluentAssertion<T> {
  return new FluentAssertion(actual);
}

export function should<T>(actual: T): FluentAssertion<T> {
  return new FluentAssertion(actual);
}

export function fluent<T>(actual: T): FluentAssertion<T> {
  return new FluentAssertion(actual);
}
