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
	.word -1082046546
	.text
	.align 2
	.globl main
	.type main, @function
main:
	addi sp, sp, -96
	sd ra, 88(sp)
	sd s0, 80(sp)
	addi s0, sp, 96
.main_label_entry:
# %op0 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -20(fp)
# %op1 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -24(fp)
# %op2 = fcmp une float %op0, %op1
	flw ft0, -20(fp)
	flw ft1, -24(fp)
	feq.s t0, ft0, ft1
	xori t0, t0, 1
	sb t0, -25(fp)
# br i1 %op2, label %label3, label %label6
	lb t0, -25(fp)
	bnez t0, .main_label3
	j .main_label6
.main_label3:
# %op4 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -32(fp)
# %op5 = fcmp ueq float %op4, 0x401070a3e0000000
	flw ft0, -32(fp)
	li s11, 1082361119
	fmv.s.x ft1, s11
	feq.s t0, ft0, ft1
	sb t0, -33(fp)
# br i1 %op5, label %label8, label %label12
	lb t0, -33(fp)
	bnez t0, .main_label8
	j .main_label12
.main_label6:
# %op7 = load i32, i32* @k
	la t0, k
	lw t0, 0(t0)
	sw t0, -40(fp)
# ret i32 %op7
	lw a0, -40(fp)
	j main_exit
.main_label8:
# %op9 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -44(fp)
# %op10 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -48(fp)
# %op11 = fcmp ult float %op9, %op10
	flw ft0, -44(fp)
	flw ft1, -48(fp)
	flt.s t0, ft0, ft1
	sb t0, -49(fp)
# br i1 %op11, label %label13, label %label14
	lb t0, -49(fp)
	bnez t0, .main_label13
	j .main_label14
.main_label12:
# br label %label6
	j .main_label6
.main_label13:
# store i32 1, i32* @k
	la t1, k
	addi t0, zero, 1
	sw t0, 0(t1)
# br label %label18
	j .main_label18
.main_label14:
# %op15 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -56(fp)
# %op16 = fsub float 0x0, 0x3ff028f5c0000000
	li s11, 0
	fmv.s.x ft0, s11
	li s11, 1065437102
	fmv.s.x ft1, s11
	fsub.s ft0,ft0,ft1
	fsw ft0, -60(fp)
# %op17 = fcmp uge float %op15, %op16
	flw ft0, -56(fp)
	flw ft1, -60(fp)
	flt.s t0, ft0, ft1
	xori t0, t0, 1
	sb t0, -61(fp)
# br i1 %op17, label %label19, label %label20
	lb t0, -61(fp)
	bnez t0, .main_label19
	j .main_label20
.main_label18:
# br label %label12
	j .main_label12
.main_label19:
# store i32 2, i32* @k
	la t1, k
	addi t0, zero, 2
	sw t0, 0(t1)
# br label %label23
	j .main_label23
.main_label20:
# %op21 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -68(fp)
# %op22 = fcmp ule float %op21, 0x4014000000000000
	flw ft0, -68(fp)
	li s11, 1084227584
	fmv.s.x ft1, s11
	flt.s t0, ft1, ft0
	xori t0, t0, 1
	sb t0, -69(fp)
# br i1 %op22, label %label24, label %label25
	lb t0, -69(fp)
	bnez t0, .main_label24
	j .main_label25
.main_label23:
# br label %label18
	j .main_label18
.main_label24:
# store i32 3, i32* @k
	la t1, k
	addi t0, zero, 3
	sw t0, 0(t1)
# br label %label29
	j .main_label29
.main_label25:
# %op26 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -76(fp)
# %op27 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -80(fp)
# %op28 = fcmp ugt float %op26, %op27
	flw ft0, -76(fp)
	flw ft1, -80(fp)
	flt.s t0, ft1, ft0
	sb t0, -81(fp)
# br i1 %op28, label %label30, label %label31
	lb t0, -81(fp)
	bnez t0, .main_label30
	j .main_label31
.main_label29:
# br label %label23
	j .main_label23
.main_label30:
# store i32 4, i32* @k
	la t1, k
	addi t0, zero, 4
	sw t0, 0(t1)
# br label %label31
	j .main_label31
.main_label31:
# br label %label29
	j .main_label29
main_exit:
	ld ra, 88(sp)
	ld s0, 80(sp)
	addi sp, sp, 96
	ret
