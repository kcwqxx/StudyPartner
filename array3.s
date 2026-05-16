# Global variables
	.text
	.data
	.globl k
	.align 2
	.type k, @object
	.size k, 4
k:
	.word 1234
	.globl w
	.align 3
	.type w, @object
	.size w, 8
w:
	.word 1
	.word 2
	.globl kw
	.align 3
	.type kw, @object
	.size kw, 12
kw:
	.word 1065437102
	.word 1082361119
	.word 1096800010
	.globl a
	.align 2
	.type a, @object
	.size a, 4
a:
	.word 1082361119
	.globl d
	.align 2
	.type d, @object
	.size d, 4
d:
	.word -1050683638
	.globl arr
	.align 3
	.type arr, @object
	.size arr, 24
arr:
	.word 1
	.word 2
	.word 3
	.word 4
	.word 5
	.word 6
	.text
	.align 2
	.globl main
	.type main, @function
main:
	addi sp, sp, -32
	sd ra, 24(sp)
	sd s0, 16(sp)
	addi s0, sp, 32
.main_label_entry:
# %op0 = getelementptr [2 x [3 x i32]], [2 x [3 x i32]]* @arr, i32 0, i32 1, i32 1
	la t1, arr
	add s11, zero, zero
	addi t0, zero, 0
	li t2, 24
	mul t2, t0, t2
	add s11, s11, t2
	addi t0, zero, 1
	li t2, 12
	mul t2, t0, t2
	add s11, s11, t2
	addi t0, zero, 1
	add s11, s11, t0
	add s11, s11, s11
	add s11, s11, s11
	add t0, s11, t1
	sd t0, -24(fp)
# %op1 = load i32, i32* %op0
	ld t0, -24(fp)
	lw t0, 0(t0)
	sw t0, -28(fp)
# ret i32 %op1
	lw a0, -28(fp)
	j main_exit
main_exit:
	ld ra, 24(sp)
	ld s0, 16(sp)
	addi sp, sp, 32
	ret
