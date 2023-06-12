<script>
	// Exports
	export let level = 'warning';
</script>

<div class="alert-box-{level}">
	<slot></slot>
</div>

<style>
  .alert-box-warning {
    color: #8a6d3b;
    background-color: #fcf8e3;
    border: 1px solid #bbb;
    border-radius: 4px;
    padding: 0.5rem;
  }
  .alert-box-error {
    color: red;
    background-color: #fcf8e3;
    border: 1px solid #bbb;
    border-radius: 4px;
    padding: 0.5rem;
  }
</style>