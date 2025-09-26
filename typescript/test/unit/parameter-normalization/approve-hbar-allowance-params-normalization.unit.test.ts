import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client, AccountId, Hbar } from '@hashgraph/sdk';
import { Context } from '@/shared/configuration';
import { AccountResolver } from '@/shared/utils/account-resolver';
import HederaParameterNormaliser from '@/shared/hedera-utils/hedera-parameter-normaliser';

// Mock the AccountResolver
vi.mock('@/shared/utils/account-resolver', () => ({
  AccountResolver: { resolveAccount: vi.fn() },
}));

describe('HederaParameterNormaliser.normaliseApproveHbarAllowance', () => {
  let mockContext: Context;
  let mockClient: Client;
  const operatorId = AccountId.fromString('0.0.5005').toString();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {};
    mockClient = {} as Client;
    vi.mocked(AccountResolver.resolveAccount).mockReturnValue(operatorId);
  });

  it('normalizes params with explicit owner, spender and decimal amount and memo', () => {
    const params = {
      ownerAccountId: '0.0.1111',
      spenderAccountId: '0.0.2222',
      amount: 0.12345678,
      transactionMemo: 'approve memo',
    };

    const res = HederaParameterNormaliser.normaliseApproveHbarAllowance(
      params as any,
      mockContext,
      mockClient,
    );

    expect(AccountResolver.resolveAccount).toHaveBeenCalledWith(
      '0.0.1111',
      mockContext,
      mockClient,
    );

    expect(res.ownerAccountId).toBe(operatorId);
    expect(res.spenderAccountId).toBe('0.0.2222');
    expect(res.transactionMemo).toBe('approve memo');
    expect(res.amount).toBeInstanceOf(Hbar);
    expect((res.amount as Hbar).toString()).toBe('0.12345678 ℏ');
  });

  it('defaults ownerAccountId using AccountResolver when not provided', () => {
    const params = {
      spenderAccountId: '0.0.3333',
      amount: 1,
    };

    const res = HederaParameterNormaliser.normaliseApproveHbarAllowance(
      params as any,
      mockContext,
      mockClient,
    );

    expect(AccountResolver.resolveAccount).toHaveBeenCalledWith(
      undefined,
      mockContext,
      mockClient,
    );
    expect(res.ownerAccountId).toBe(operatorId);
    expect(res.spenderAccountId).toBe('0.0.3333');
    expect((res.amount as Hbar).toString()).toBe('1 ℏ');
  });

  it('throws for negative amounts', () => {
    const params = {
      ownerAccountId: '0.0.1111',
      spenderAccountId: '0.0.2222',
      amount: -0.1,
    };

    expect(() =>
      HederaParameterNormaliser.normaliseApproveHbarAllowance(
        params as any,
        mockContext,
        mockClient,
      ),
    ).toThrowError(/Invalid allowance amount/);
  });
});
